Webdriver Manager
=================

A selenium server and browser driver manager for your end to end tests. This is the same tool as `webdriver-manager` from the [Protractor](https://github.com/angular/protractor) repository.

Getting Started
---------------

```
npm install -g webdriver-manager
```

Setting up a Selenium Server
----------------------------

Prior to starting the selenium server, download the selenium server jar and driver binaries. By default it will download the selenium server jar and chromedriver binary.

```
webdriver-manager update
```

Starting the Selenium Server
----------------------------

By default, the selenium server will run on `http://localhost:4444/wd/hub`.


```
webdriver-manager start
```

Other useful commands
---------------------

View different versions of server and driver files:

```
webdriver-manager status
```

Clear out the server and driver files. If `webdriver-manager start` does not work, try to clear out the saved files.

```
webdriver-manager clean
```
