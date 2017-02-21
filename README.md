# Search a MySQL table through HTTP requests

(but with very little change sure it'd work with other DB engines)

This project is bascally two things (will refactor and separate them):
* A search module built upon Sequelize for generating custom queries to search strings in all (or specified) fields in a database table
* An HTTP interface for that module

The module generates big SQL query with tons of: ```a LIKE "%something%" OR b LIKE "%something%" OR ...```, etc., depending on the match type requested.

Originally developed for personal use but it might be useful to someone else.

**Soon** will be publishing the search module separate from the server for the HTTP interface

# Install

```
$ npm install
```

Will automatically run `node configure.js`, which asks for connection data, database name, table, fields to search and fields to return.

# Use

```
$ PORT=4444 npm start
```

if no port specified will listen on 3000

## Endpoints

* http://localhost:3000/search?q=term&type=any|all|full
* http://localhost:3000/columns
* http://localhost:3000/columns/selected (those listed under *displayFields*)
* http://localhost:3000/demo


# Configure

Run ```$ node configure.js```, then copy config.json.generated to config.json

(This script auto-runs after `npm install`)

Also you can manually set configurations copying config.json.sample to config.json and writing there.

## Nginx proxy

To expose this API publically configure your web server to proxy requests to the port on which is running.

E.g to setup in http://my-domain.com/customsearch add to the my-domain.com vhost:

```
server {
	listen 80;
	server_name my-domain.com;

	# ... vhost configurations

	location /customsearch/ {
	    proxy_set_header   X-Real-IP $remote_addr;
	    proxy_set_header   Host      $http_host;
	    proxy_pass         http://localhost:3000/; # the port where its listening
	}
}

```

# License

MIT
