module.exports = {
  "presets": [
    [
      "env",
      {
        "loose": true,
        "useBuiltIns": "usage"
      }
    ],
    "react",
    "flow",
    "stage-1"
  ],
  "plugins": [
    "transform-class-properties",
    "transform-decorators-legacy",
    ["module-resolver", {
      "root": "./src",
      "alias": {
      }
    }]
  ],
  "env": {
    "development": {
      "plugins": [
        "transform-react-jsx-source",
        "flow-react-proptypes",
        "transform-dev-warning"
      ]
    },
    "production": {
      "compact": true,
      "plugins": ["transform-react-constant-elements"]
    }
  }
}
