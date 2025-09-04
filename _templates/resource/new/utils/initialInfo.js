export const getEntityInfo = async (prompter) => {
  return prompter.prompt([
    {
      type: "input",
      name: "name",
      message:
        "What is the name of the resource (for internal use: e.g. user)?",
    },
    {
      type: "input",
      name: "singularLabel",
      message:
        "What is the singular label of the resource (for display use: e.g. User)?",
    },
    {
      type: "input",
      name: "pluralLabel",
      message:
        "What is the plural label of the resource (for display use: e.g. Users)?",
    },
  ]);
};
