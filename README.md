This is bascally a HTTP interface to search strings in all (or specified) fields in a database table.

Generates big SQL query with tons of: ```a LIKE "%something%" OR b LIKE "%something%"```, etc.

Originally I developed it for personal use but it might be useful to someone else.

# Install

```
$ npm install
```

Will automatically run configure.js, which asks for connection data, database name, table, fields to search and fields to return


# Use

```
$ PORT=4444 node index.js
```

if no port specified will listen on 3000

## Endpoints

* http://localhost:3000/search?q=term&type=any|all|full
* http://localhost:3000/columns
* http://localhost:3000/demo


# Configure

Run ```$ node configure.js```, then copy config.json.generated to config.json

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
