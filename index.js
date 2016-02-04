import marked from 'marked-ast';
import MdRenderer from 'marked-to-md';

const input = `
# **foo**

## Requirements
asdas

## Specs
asdasd

## Subissues

- [x] asdasd #123
- [] ljlkjl #456
`;

const ast = marked.parse(input);

const renderer = new MdRenderer({});

///////////////

///////////////

function transform(ast, visitors) {

  const { ast: transformedAst } = Object.keys(ast).reduce(({ ast, currentSection }, astKey) => {
    const node = ast[astKey];

    // handle subissues separately
    if (currentSection && currentSection.text[0].indexOf && currentSection.text[0].indexOf('Subissues') !== -1) {
      if (node.type === 'list') {
        ast[astKey].body = visitors.subissues(node.body.map(subissue => ({
          ...subissue,
          text: subissue.text.join('')
        })))
        return { ast, null }
      }
    }

    if (node.text && Array.isArray(node.text)) {
      ast[astKey].text = node.text.map(t => {
        // if (typeof t === 'object') {
        //   console.log(t);
        //   console.log(transform(t, visitors));
        // }
        return transform(t, visitors);
      });
    }

    if (node.text && typeof node.text === 'object') {
      ast[astKey].text = transform(node.text, visitors);
    }

    if (node.body && typeof node.body === 'object') {
      ast[astKey].body = transform(node.body, visitors);
    }

    // generic handling of visitors by node.type
    const visitor = visitors[node.type];
    if (visitor) {
      ast[astKey] = visitor(node);
    }

    // keep track of the current section
    if (node.type === 'heading') {
      return { ast, currentSection: node };
    } else {
      return { ast, currentSection };
    }
  }, { ast });

  return transformedAst;
}

function transformSubissues(subissues) {
  const isOpen = subissue => subissue.text.indexOf('[x]') === -1;
  return subissues
    .filter(isOpen)
    .map(subissue => ({
      ...subissue,
      text: '[] Look mum, I\'m not closed!'
    }));
}

const transformedAst = transform(ast, {
  subissues: transformSubissues,
  heading(node) {
    return {
      ...node,
      level: 1
    };
  },
  strong(node) {
    return {
      ...node,
      type: 'em'
    }
  }
});

console.log(ast);


const output = marked.render(transformedAst, renderer);

console.log('\n----------INPUT-----------');
console.log(input)

console.log('\n----------OUTPUT----------');
console.log(output);
