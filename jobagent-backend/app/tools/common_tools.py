def add(first, second):
    return first + second


tool_list = {
    "add": add
}


def get_tool_by_name(name):
    return tool_list[name]


if __name__ == "__main__":
    para = {
        "first": 1,
        "second": 2
    }
    tool_name = "add"
    local_tool = get_tool_by_name(tool_name)
    print(local_tool(**para))
