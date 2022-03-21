// Karma configuration
// Generated on Sat Sep 10 2016 10:00:25 GMT+0200 (CEST)

module.exports = function exports(config) {
  const files = [
    'dist/secretin.js',
    'dist/adapters/browser.js',
    'test/fixtures/keys.js',
    'test/fixtures/exportedDB.js',
    'test/helpers.js',
    'test/mock.js',
    'test/*.test.js',
  ];

  const karmaConfig = {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    client: {
      mocha: {
        timeout: '120000',
      },
      args: [process.env.API_TYPE, process.env.SERVER_URI],
    },

    browserNoActivityTimeout: '240000',

    // list of files / patterns to load in the browser
    files,

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR
    //               || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    customLaunchers: {
      ChromeOnTravis: {
        base: 'Chrome',
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: process.env.singleRun === 'true',

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  };

  if (process.env.CI === 'true') {
    karmaConfig.browsers = ['ChromeOnTravis'];
  }

  config.set(karmaConfig);
};
