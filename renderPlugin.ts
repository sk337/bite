import { Plugin } from 'bun';

const renderPlugin: Plugin = {
  name: 'renderPlugin',
  setup(build) {
    build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
      const transformedSource = `
        import React from 'react';
        import ReactDOM from 'react-dom';
        import Component from '${args.path}';

        ReactDOM.render(
          React.createElement(Component, null),
          document.getElementById('root')
        );
      `;
      return {
        contents: transformedSource,
        loader: 'jsx',
      };
    });
  },
};

export default renderPlugin;
