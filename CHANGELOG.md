# 10.0.4

## Dependency Upgrades

- ([970167a](https://github.com/angular/webdriver-manager/commit/970167a1b2db24fc8ca34db2994507ef0187ee7e))
  dep(typings): update typings (#42)
  
## Bug Fixes

- ([5073e23](https://github.com/angular/webdriver-manager/commit/5073e230574237047dd593a702f08f84907871bd))
  fix(folder): fix selenium folder location (#43)

# 10.0.3

## Bug Fixes

- ([d3724fb](https://github.com/angular/webdriver-manager/commit/d3724fbd9f6b0ceb481538f7f8f0088c8b004959))
  fix(config): simplify locating configuration file, selenium folder (#41)

  * Let the bin file decide which webdriver-manager to use
  * Use the configuration file / package from the default position
  * Selenium folder will always be located to webdriver-manager/selenium/

# 10.0.2

## Bug Fixes

- ([5bca026](https://github.com/angular/webdriver-manager/commit/5bca0266118dcabf2e2782820e5c9095f6d16ed4))
  fix(config): configuration file local look up when used as a dependency (#33)

  closes #32
- ([0cfcc88](https://github.com/angular/webdriver-manager/commit/0cfcc88f1383c400f72ea5e49f9600ff652f8214))
  fix(binary): Fix typo in fallback case when chalk isn't available.


# 10.0.1

## Bug Fixes

- ([a6f1edd](https://github.com/angular/webdriver-manager/commit/a6f1edd782251c96d35e79a3bb78b70c2b137aa9))
  fix(global): fix finding config.json for global installs and release 10.0.1 (#23)

# 10.0.0


## Bug Fixes

- ([70d32df](https://github.com/angular/webdriver-manager/commit/70d32df659f19510c25e97ea9a42c7f93813d448))
  fix(dir): check selenium dir and warn user that the folder does not exist (#17)

- ([0ec1443](https://github.com/angular/webdriver-manager/commit/0ec14435379161259435edc7c766388941f1a846))
  fix(binary): file type, unzipping, and permissions

  closes #7, #16

- ([a073fd0](https://github.com/angular/webdriver-manager/commit/a073fd0e9d0290e52ac3a808643b069c71b196c3))
  fix(npm): use global, local, and project without env

  closes #20


- ([6ccb9d8](https://github.com/angular/webdriver-manager/commit/6ccb9d8b9ac6daf79388c44e6d53f1d3d71fd3f8))
  fix(versions): versions option should stay consistent with existing webdriver-manager

  closes #6

- ([c34b05c](https://github.com/angular/webdriver-manager/commit/c34b05cc66849708a2fc515bc455a6a661c867d6))
  fix(bin): local, project, and global usage

- ([4a0caf5](https://github.com/angular/webdriver-manager/commit/4a0caf5a69cacda01df87d4b4cc35092e519d267))
  fix(dep): fix dependency for chalk

- ([15ae0e8](https://github.com/angular/webdriver-manager/commit/15ae0e815270c8af2441002492e3165edd3140df))
  fix(chmod): set permissions to 755

([1820fbc](https://github.com/angular/webdriver-manager/commit/1820fbc46ddc45b70911fb1678f1d99247ec7028))
  Initial commit

## Features

- ([374c3e7](https://github.com/angular/webdriver-manager/commit/374c3e719fce18a2f0a1b751b19bffb7d266cc69))
  feat(length): on update, check to see the file is the correct length

  closes #8
- ([8c47291](https://github.com/angular/webdriver-manager/commit/8c472918ac73390890bbc39fcc4c7a2e86d3b262))
  feat(local): use the local version of webdriver-tool if it is installed

  closes #5

- ([f0622d2](https://github.com/angular/webdriver-manager/commit/f0622d2e173b68e4afcd409f9c0356c8a1c2652a))
  feat(logs): add chrome logs command line option


  closes #11
- ([3b30312](https://github.com/angular/webdriver-manager/commit/3b303129040b17292028452f13c73d62736f1216))
  feat(logger): update logging methods (#5)
