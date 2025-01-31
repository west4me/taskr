module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:jest/recommended"
    ],
    settings: {
        react: {
            version: "detect"
        }
    },
    plugins: ["react", "jest"],
    rules: {
        "react/react-in-jsx-scope": "off", // ✅ No need to import React in React 17+
        "no-unused-vars": "warn", // ⚠️ Make unused vars a warning instead of error
        "no-prototype-builtins": "off", // ✅ Disable this for `hasOwnProperty`
        "no-useless-escape": "off", // ✅ Ignore unnecessary escapes
        "no-empty": "warn", // ⚠️ Warn about empty blocks, don’t break code
        "no-cond-assign": ["error", "except-parens"], // ✅ Prevent assignment inside conditionals unless wrapped in parens
        "valid-typeof": "warn", // ⚠️ Allow some flexibility in `typeof` checks
        "no-func-assign": "warn", // ⚠️ Don't treat function reassignments as errors
        "no-undef": "warn", // ⚠️ Prevent undeclared variables from stopping the build
        "react/prop-types": "off", // ✅ Disable PropTypes validation if you're using TypeScript
        "jest/no-disabled-tests": "warn",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "jest/prefer-to-have-length": "warn",
        "jest/valid-expect": "error"
    }
};
