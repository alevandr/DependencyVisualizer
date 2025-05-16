#pragma once

#include <iostream>
#include <fstream>
#include <filesystem>
#include <string>
#include <vector>
#include <regex>

using
std::string,
std::vector,
std::pair,
std::regex;

namespace dc
{
	class Reader
	{
	public:
		vector<std::pair<string, vector<string>>> getRawData(const string& directoryPath) const
		{
			vector<pair<string, vector<string>>> rawData;
			using recursive_directory_iterator = std::filesystem::recursive_directory_iterator;
			for (const auto& dirEntry : recursive_directory_iterator(directoryPath))
			{
				string extension;
				string path;
				try
				{
					auto wsExtension = dirEntry.path().extension().wstring();
					auto wsPath = dirEntry.path().wstring();
					extension = string(wsExtension.begin(), wsExtension.end());
					path = string(wsPath.begin(), wsPath.end());
				}
				catch (const std::exception& e)
				{
					auto err = e.what();
				}
				for (size_t i = 0; i < path.size() - 1; i++)
				{
					if (path[i] == '\\')
						path[i] = '/';
				}
				try
				{
					if (extension == ".cpp" || extension == ".hpp" || extension == ".h")
					{
						rawData.emplace_back(path, getIncludesFromFile(path));
						//cout << dirEntry.path().string() << endl;
					}
				}
				catch (const std::exception& e)
				{
					auto err = e.what();
				}
			}
			return rawData;
		}

	private:
		regex patternSystem = regex("^.*#include <.*>");
		regex patternUserDefined = regex("^.*#include \".*\"");
		vector<string> getIncludesFromFile(const string& path) const
		{
			vector<string> includes;
			std::ifstream file(path);
			string line;
			while (std::getline(file, line))
			{
				if (regex_match(line, patternSystem) || regex_match(line, patternUserDefined))
				{
					includes.emplace_back(line);
				}
			}
			return includes;
		}
	};
}