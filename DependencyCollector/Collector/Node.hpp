#pragma once

#include <string>

using 
std::string;
namespace dc
{
	class Node
	{
	public:
		string name; //File name
		string id; //Full path
		string group; // for different colors in webui
		Node() {};
		Node(string filePath) : id(filePath) {};
		Node(string name, string id, string group) : name(name), id(id), group(group) {};
		~Node() {};
		std::hash<std::string> hasher;
		bool operator< (const Node& node) const
		{
			return hasher(id) < hasher(node.id);
		}
		bool operator> (const Node& node) const
		{
			return hasher(id) > hasher(node.id);
		}
		bool operator!= (const Node& node) const
		{
			return hasher(id) != hasher(node.id);
		}
	};
}