const { getEntityInfo } = require("./utils/initialInfo");

module.exports = {
  prompt: async ({ prompter }) => {
    const { name, singularLabel, pluralLabel } = await getEntityInfo(prompter);

    console.info(
      `Creating resource ${name} (${singularLabel} / ${pluralLabel})`
    );

    return {
      name,
      singularLabel,
      pluralLabel,
    };
  },
};
