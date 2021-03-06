module.exports = function () {

    var me = this;
    var clone = function (d) {
        return JSON.parse(JSON.stringify(d));
    },
            tag = function (resourcename) {
                return resourcename[0].toUpperCase() + resourcename.substr(1);
            };

    this.addGet = function (resourcename, method, swagger, endpoint,
            resourceConfig) {
        if (method == "get") {
            if (!endpoint.responses[200]) {
                endpoint.responses[200] = {
                    "schema": {
                        type: "object",
                        properties: clone(resourceConfig.properties)
                    }
                };
            }
            if (!endpoint.parameters) {
                endpoint.parameters = [
                    {
                        "in": "path",
                        "name": "id",
                        "description": resourcename + " id (hash-string)",
                        "required": true,
                        "type": "string"
                    }
                ];
            }
            if (!swagger.paths)
                swagger.paths = {};
            if (!swagger.paths["/" + resourcename + "/{id}"])
                swagger.paths["/" + resourcename + "/{id}"] = {};
            if (!endpoint.description)
                endpoint.description = "retrieve a " + resourcename + " item with given id";
            swagger.paths["/" + resourcename + "/{id}"][method] = endpoint;
            var endpoint2 = {
                responses: {
                    200: {
                        "schema": {
                            type: "array",
                            items: [{
                                    type: "object",
                                    properties: clone(resourceConfig.properties)
                                }]
                        }
                    }
                },
                tags: [tag(resourcename)]
            };
            if (!swagger.paths["/" + resourcename])
                swagger.paths["/" + resourcename] = {};
            endpoint2.description = "retrieve array of " + resourcename + " items";
            swagger.paths["/" + resourcename][method] = endpoint2;
        }
    };

    this.addPost = function (resourcename, method, swagger, endpoint,
            resourceConfig) {
        if (method == "post") {
            if (!swagger.paths["/" + resourcename + "/{id}"])
                swagger.paths["/" + resourcename + "/{id}"] = {};
            if (!endpoint.parameters) {
                endpoint.parameters = [
                    {
                        "in": "body",
                        "name": "body",
                        "description": resourcename + " object that needs to be added",
                        "required": true,
                        "schema": {
                            type: "object",
                            properties: clone(resourceConfig.properties)
                        }
                    }
                ];
            }
            if (!endpoint.description)
                endpoint.description = "create a " + resourcename + " item";
            swagger.paths["/" + resourcename][method] = endpoint;
        }
    };

    this.addPut = function (resourcename, method, swagger, endpoint,
            resourceConfig) {
        if (method == "put") {
            if (!swagger.paths["/" + resourcename + "/{id}"])
                swagger.paths["/" + resourcename + "/{id}"] = {};
            if (!endpoint.parameters) {
                endpoint.parameters = [
                    {
                        "in": "path",
                        "name": "id",
                        "description": resourcename + " id (hash-string)",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "in": "body",
                        "name": "payload",
                        "description": resourcename + " field(s) that needs to be updated",
                        "required": true,
                        "schema": {
                            type: "object",
                            properties: clone(resourceConfig.properties)
                        }
                    }
                ];
            }
            if (!endpoint.description)
                endpoint.description = "update " + resourcename + " item-value(s) based on a given id";
            swagger.paths["/" + resourcename + "/{id}"][method] = endpoint;
        }
    };

    this.addDelete = function (resourcename, method, swagger, endpoint,
            resourceConfig) {
        if (method == "delete" && !endpoint.parameters) {
            if (!swagger.paths["/" + resourcename + "/{id}"])
                swagger.paths["/" + resourcename + "/{id}"] = {};
            swagger.paths["/" + resourcename + "/{id}"][method] = endpoint;
            if (!endpoint.description)
                endpoint.description = "deletes an " + resourcename + " item based on a given id";
        }
    };

    this.addUserEndpoints = function (resourcename, swagger, resourceConfig,
            swaggerConfig) {
        var hide = swaggerConfig.hide ? swaggerConfig.hide.users : {};
        if (hide.indexOf('login') !== -1)
            swagger.paths["/" + resourcename + "/login"] = {
                "post": {
                    "description": "log user in and receive user object with sessionid (or error)",
                    "responses": {
                    },
                    "parameters": [
                        {
                            "in": "body",
                            "name": "payload",
                            "description": "object with credentials",
                            "required": true,
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "username": {
                                        type: "string",
                                        default: "john",
                                        required: true
                                    },
                                    "password": {
                                        type: "string",
                                        default: "foobar",
                                        required: true
                                    }
                                }
                            }
                        }
                    ],
                    tags: [tag(resourcename)]
                }
            };
        if (hide.indexOf('logout') !== -1)
            swagger.paths["/" + resourcename + "/logout"] = {
                "post": {
                    "description": "log user out and end session",
                    "responses": {
                    },
                    "parameters": [],
                    tags: [tag(resourcename)]
                }
            };
        if (hide.indexOf('me') !== -1)
            swagger.paths["/" + resourcename + "/me"] = {
                "get": {
                    "description": "get current user",
                    "responses": {
                    },
                    "parameters": [],
                    tags: [tag(resourcename)]
                }
            };
    };

    this.initResources = function (swagger, dpd) {
        var swaggerConfig = dpd.swagger.getResource().config;
        for (var i in dpd) {
            if (i == "swagger")
                continue;
            var resource = dpd[i];
            var resourceConfig = resource.getResource().config;
            var sdef = resourceConfig.swagger ? resourceConfig.swagger : false;
            var iConfig = swaggerConfig[i] || {};
            if (!sdef) { // only auto-document Collections
                var types = ["Collection", "UserCollection"];
                if (types.indexOf(resourceConfig.type) != -1) {
                    sdef = {methods: {
                            "get": {},
                            "post": {},
                            "put": {},
                            "delete": {}
                        }};
                    for (var method in sdef.methods) {
                        var endpoint = sdef.methods[method];
                        if (endpoint.public !== undefined && !endpoint.public)
                            continue
                        endpoint.responses = endpoint.responses || {};
                        endpoint.tags = [tag(i)];
                        // GET is not hidden for i
                        if (!iConfig.hide || iConfig.hide.indexOf('GET') === -1)
                            me.addGet(i, method, swagger, endpoint, resourceConfig, swaggerConfig[i]);
                        // POST is not hidden for i
                        if (!iConfig.hide || iConfig.hide.indexOf('POST') === -1)
                            me.addPost(i, method, swagger, endpoint, resourceConfig, swaggerConfig[i]);
                        // DELETE is not hidden for i
                        if (!iConfig.hide || iConfig.hide.indexOf('DELETE') === -1)
                            me.addDelete(i, method, swagger, endpoint, resourceConfig, swaggerConfig[i]);
                        // PUT is not hidden for i
                        if (!iConfig.hide || iConfig.hide.indexOf('PUT') === -1)
                            me.addPut(i, method, swagger, endpoint, resourceConfig, swaggerConfig[i]);
                    }
                }
                if (resourceConfig.type == "UserCollection")
                    me.addUserEndpoints(i, swagger, resourceConfig, swaggerConfig[i]);
            }
            else if (typeof sdef === 'object') {
                for (var a in sdef) {
                    swagger.paths[a] = sdef[a];
                }
            }
        }
    };
    return this;
};

module.exports = module.exports();
