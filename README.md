Webdriver Tool
==============

Webdriver tool is a manager for selenium standalone server jar and browser drivers executables. This is the same tool as `webdriver-manager` from the [Protractor](https://github.com/angular/protractor) repository.

Getting Started
---------------

```
npm install -g webdriver-tool
```

Setting up a Selenium Server
----------------------------

Prior to starting the selenium server, download the selenium server jar and driver binaries. By default it will download the selenium server jar and chromedriver binary.

```
webdriver-tool update
```

Starting the Selenium Server
----------------------------

By default, the selenium server will run on `http://localhost:4444/wd/hub`.


```
webdriver-tool start
```

Other useful commands
---------------------

View different versions of server and driver files:

```
webdriver-tool status
```

Clear out the server and driver files. If `webdriver-tool start` does not work, try to clear out the saved files.

```
webdriver-tool clean
```
