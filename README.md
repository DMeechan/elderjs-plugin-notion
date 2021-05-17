# Elder.js Plugin: Notion

Easily use Notion as a CMS for your Elder.js site.

> 🚨 This plugin is a very early work in progress! The instructions below won't work just yet!

### What does the plugin do?

This plugin fetches pages from a database in Notion, parses the contents, then makes it available for your Svelte templates.

For example, you can write all of your blog posts in Notion then have Elder.js statically generate all the pages for you.

It's similar to [Elder.js's official markdown plugin](https://github.com/Elderjs/plugins/tree/master/packages/markdown), but using Notion instead of markdown files.

### Install

```bash
npm install --save dmeechan/elderjs-plugin-notion
```

### Set up a database in Notion



### Config

Once installed, open your `elder.config.js` and configure the plugin by adding `dmeechan/elderjs-plugin-notion` to your plugin object:

```javascript
plugins: {
  'dmeechan/elderjs-plugin-notion': {
    ... todo ...
  },

}
```


```bash
npm i -s elderjs-plugin-your-plugin
```


## Config

> Here is where you want to outline the config options of your plugin.

Once installed, open your `elder.config.js` and configure the plugin by adding 'elder-plugin-your-plugin' to your plugin object.

```javascript
plugins: {

  'elderjs-plugin-your-plugin': {
    ... your plugin options
  },

}
```
