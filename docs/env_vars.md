# Environment variables

**`JAVA_HOME`** - If the java home variable is set as an environment variable,
use it when starting the selenium server. The java executable is assumed to be
found in `JAVA_HOME/bin/java`.

**`NO_PROXY`** - If the no proxy environment variable exists and matches the
host name, to ignore the resolve proxy.

**`HTTPS_PROXY`** - If the https proxy environment variable exists and the url
protocol is https, use this proxy.

**`HTTP_PROXY`** - If the http proxy environmet variable exists and the url
protocol is http or https, use this proxy.

**`GITHUB_TOKEN`** - A GitHub personal access token with no additional scopes
required. When created, it will just have public-access. This can be set at
[https://github.com/settings/tokens][1].

[1]: https://github.com/settings/tokens