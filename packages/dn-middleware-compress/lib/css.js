const CleanCSS = require('clean-css');
const fs = require('mz/fs');

module.exports = async (file, opts) => {
  opts = Object.assign({}, opts);
  const source = (await fs.readFile(file)).toString();
  const cleanCss = new CleanCSS(opts.css);
  const { errors, styles } = cleanCss.minify(source);
  if (errors && errors[0]) throw new Error(errors[0]);
  await fs.writeFile(file, styles);
};