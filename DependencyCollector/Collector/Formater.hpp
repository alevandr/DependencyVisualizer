#pragma once

#include "Node.hpp"
#include <vector>
#include <map>
#include <boost/algorithm/string.hpp>

using
std::string,
std::pair,
std::vector,
std::map;

namespace dc
{
	class Formater
	{
	public:
		static map<Node, vector<Node>> formatData(const vector<pair<string, vector<string>>>& rawData)
		{
			auto getCleanInclude = [](const string& rawInclude)
				{
					string include;
					size_t includeStart = rawInclude.find_first_of("#");
					includeStart += 10;
					for (size_t i = includeStart; i < rawInclude.size(); i++)
					{
						if (rawInclude[i] == '>' || rawInclude[i] == '\"')
							return include;
						include += rawInclude[i];
					}
					return "error in: " + include;
				};

			auto reconstruct = [](const string& filePath, const string& cleanInclude)
				{
					if (cleanInclude.find(':') != std::string::npos)
						return cleanInclude;

					vector<string> current;
					boost::split(current, filePath, boost::is_any_of("/"));
					current.pop_back();

					vector<string> include;
					boost::split(include, cleanInclude, boost::is_any_of("/"));

					for (const auto& lvl : include)
					{
						if (lvl == "..")
							current.pop_back();
						else
							current.push_back(lvl);
					}

					string fullInclude = boost::join(current, "/");
					return fullInclude;
				};

			auto getGroup = [](const string& filePath)
				{
					vector<string> current;
					boost::split(current, filePath, boost::is_any_of("/"));
					current.pop_back();
					return current[current.size() - 1]; // potential out of bounds
				};

			std::hash<std::string> hasher;
			map<Node, vector<Node>> formatedData;
			for (const auto& [filePath, rawIncludes] : rawData)
			{
				Node current_file(filePath, std::to_string(hasher(filePath)), getGroup(filePath));
				pair<Node, vector<Node>> pCurrent;
				pCurrent.first = current_file;
				if (!formatedData.contains(current_file))
				{
					formatedData.emplace(pCurrent);
				}
				for (const auto& rawInclude : rawIncludes)
				{
					string cleanInclude = getCleanInclude(rawInclude);
					string reconstructedInclude = reconstruct(filePath, cleanInclude);
					Node include(reconstructedInclude, std::to_string(hasher(reconstructedInclude)), getGroup(reconstructedInclude));
					if (!formatedData.contains(include))
					{
						pair<Node, vector<Node>> pInclude;
						pInclude.first = include;
						formatedData.emplace(pInclude);
					}
					formatedData.at(current_file).emplace_back(include);
				}
				std::sort(formatedData.at(current_file).begin(), formatedData.at(current_file).end()); // I'm not sure whether it's doing something or not
			}
			return formatedData;
		}
	};
}