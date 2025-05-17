#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <boost/algorithm/string.hpp>

#include "Node.hpp"

using
std::string,
std::vector,
std::map;

namespace dc
{
	class Serializer
	{
	public:
		string serialize(const map<Node, vector<Node>>& data, const string& outputPath = "") const
		{
			string Nodes;
			Nodes += "{\"nodes\":[\n";
			for (auto [node, links] : data)
			{
				Nodes += "{";
				Nodes += "\"name\": \"" + node.name + "\", ";
				Nodes += "\"id\": \"" + node.id + "\", ";
				Nodes += "\"group\": \"" + node.group + "\"";
				Nodes += "}, \n";
			}
			Nodes.pop_back();
			Nodes.pop_back();
			Nodes.pop_back();
			Nodes += "\n], \n";

			string Links;
			Links += "\"links\":[\n";
			for (auto [node, links] : data)
			{
				for (auto link : links)
				{
					Links += "{";
					Links += "\"source\": \"" + link.id + "\", "; // might be configuragble (where does arrow point? - from file to include; - from include to file)
					Links += "\"target\": \"" + node.id + "\"";   // might be configuragble (where does arrow point? - from file to include; - from include to file)
					Links += "}, \n";
				}
			}
			Links.pop_back();
			Links.pop_back();
			Links.pop_back();
			Links += "\n], \n";

			string LinksArr;
			LinksArr += "\"linksArr\":[\n";
			map<string, vector<string>> allLinks;
			for (const auto& [node, links] : data)
			{
				if (!allLinks.contains(node.id))
				{
					allLinks.insert({ node.id, {} });
				}
				for (const auto& link : links)
				{
					allLinks[node.id].emplace_back(link.id);
					if (!allLinks.contains(link.id))
					{
						allLinks.insert({ link.id, {} });
					}
					allLinks[link.id].emplace_back(node.id);
				}
			}
			for (const auto& [node, links] : allLinks)
			{
				LinksArr += "{";
				LinksArr += "\"source\": \"" + node + "\", ";
				LinksArr += "\"targets\": ";
				LinksArr += "[";
				vector<string> strLinks;
				for (auto link : links)
				{
					strLinks.emplace_back("\"" + link + "\"");
				}
				LinksArr += boost::join(strLinks, ", ");
				LinksArr += "]";
				LinksArr += "}, \n";
			}
			LinksArr.pop_back();
			LinksArr.pop_back();
			LinksArr.pop_back();
			LinksArr += "\n]}";

			if (!outputPath.empty())
			{
				std::ofstream o(outputPath);
				o << Nodes << std::endl;
				o << Links << std::endl;
				o << LinksArr << std::endl;
			}

			return Nodes + Links + LinksArr;
		}
	};
}