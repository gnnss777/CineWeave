export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow non-conventional commits when "WIP:" prefix is used
    'header-max-length': [2, 'always', 72],
  },
};
