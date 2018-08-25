# Utils

Developer notes for scope of each file:

* **cloud_storage_xml** handles the Google Cloud Storage specific items like
downloading the xml and converting the xml into a version list.
* **file_utils** manages files including reading xml and json files,
uncompressing files, renaming files, and checking if we should renew the cache
of xml or json files.
* **github_json** handles the GitHub specific items like downloading the json
and converting that to a version list. Also adds GitHub specific headers to the
request including oauth token.
* **http_utils** handles requests like downloading a binary or getting the
contents of the body.
* **version_list** is a data object to help organize the versions from the
cache. The versions must be in semantic version format.