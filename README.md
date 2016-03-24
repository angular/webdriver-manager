Webdriver Tool
==============

Getting Started
---------------

```
npm install -g webdriver-tool
```

Setting up a Selenium Server
----------------------------

Prior to starting the selenium server, download the selenium server jar and driver binaries. By default it will download the selenium server jar and chromedriver binary.

```
bin/webdriver-tool update
```

Starting the Selenium Server
----------------------------

By default, the selenium server will run on `http://localhost:4444/wd/hub`.


```
bin/webdriver-tool start
```

Other useful commands
---------------------

View different versions of server and driver files:

```
bin/webdriver-tool status
```

Clear out the server and driver files. If `webdriver-tool start` does not work, try to clear out the saved files.

```
bin/webdriver-tool clean
```
