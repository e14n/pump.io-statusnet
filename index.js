// pump.io-statusnet.js
//
// additional routes for objects imported from statusnet
//
// Copyright 2013, E14N https://e14n.com/
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var path = require("path"),
    Step = require("step"),
    _ = require("underscore"),
    connect = require("connect"),
    send = connect.middleware.static.send,
    finishers = require("../../lib/finishers"),
    Note = require("../../lib/model/note").Note,
    Person = require("../../lib/model/person").Person,
    HTTPError = require("../../lib/httperror").HTTPError,
    authc = require("../lib/authc"),
    omw = require("../lib/objectmiddleware"),
    principal = authc.principal,
    addLiked = finishers.addLiked,
    addShared = finishers.addShared,
    addLikers = finishers.addLikers,
    firstFewReplies = finishers.firstFewReplies,
    firstFewShares = finishers.firstFewShares,
    addFollowed = finishers.addFollowed,
    principalAuthorOrRecipient = omw.principalAuthorOrRecipient,
    anyReadAuth = authc.anyReadAuth,
    authorOrRecipient = omw.authorOrRecipient;

var StatusnetPlugin = function() {

    var plugin = this,
        log = null,
        addRoute = function(app) {
            var get = app.routes.routes.get,
                args = Array.prototype.slice.call(arguments, 1);
            app.get.apply(app, args);
            // This puts our route at the top
            get.unshift(get.pop());
        },
        noteFromID = function(req, res, next) {
            Step(
                function() {
                    Note.search({"status_net.notice_id": req.params.id}, this);
                },
                function(err, notes) {
                    if (err) {
                        next(err);
                    } else if (!notes || notes.length != 1) {
                        next(new HTTPError("No such note: " + req.params.id, 404));
                    } else {
                        req.note = notes[0];
                        req.type = Note.type;
                        next();
                    }
                }
            );
        },
        userFromID = function(req, res, next) {
            Step(
                function() {
                    Person.search({"status_net.profile_info.local_id": req.params.id}, this);
                },
                function(err, people) {
                    if (err) {
                        next(err);
                    } else if (!people || people.length != 1) {
                        next(new HTTPError("No user with id " + req.params.id, 404));
                    } else {
                        req.person = people[0];
                        next();
                    }
                }
            );
        },
        showNote = function(req, res, next) {

            var obj = req.note,
                person = obj.author,
                profile = req.principal;

            Step(
                function() {
                    obj.expandFeeds(this);
                },
                function(err) {
                    if (err) throw err;
                    addLiked(profile, [obj], this.parallel());
                    addShared(profile, [obj], this.parallel());
                    addLikers(profile, [obj], this.parallel());
                    firstFewReplies(profile, [obj], this.parallel());
                    firstFewShares(profile, [obj], this.parallel());
                    if (obj.isFollowable()) {
                        addFollowed(profile, [obj], this.parallel());
                    }
                },
                function(err) {
                    var title;
                    if (err) {
                        next(err);
                    } else {
                        if (obj.displayName) {
                            title = obj.displayName;
                        } else {
                            title = "note by " + person.displayName;
                        }
                        res.render("object", {page: {title: title, url: req.originalUrl},
                                              object: obj,
                                              data: {
                                                  object: obj
                                              }
                                             });
                    }
                }
            );
        },
        jsonNote = function(req, res, next) {

            var obj = req.note,
                person = obj.author,
                profile = req.principal;

            Step(
                function() {
                    obj.expandFeeds(this);
                },
                function(err) {
                    if (err) throw err;
                    addLiked(profile, [obj], this.parallel());
                    addShared(profile, [obj], this.parallel());
                    addLikers(profile, [obj], this.parallel());
                    firstFewReplies(profile, [obj], this.parallel());
                    firstFewShares(profile, [obj], this.parallel());
                    if (obj.isFollowable()) {
                        addFollowed(profile, [obj], this.parallel());
                    }
                },
                function(err) {
                    var title;
                    if (err) {
                        next(err);
                    } else {
                        obj.sanitize(principal);
                        res.json(obj);
                    }
                }
            );
        };


    plugin.initializeLog = function(log) {
        this.log = log.child({component: "pump.io-statusnet"});
        return;
    };

    plugin.initializeSchema = function(schema) {
        // Add indices that help us
        schema.person.indices.push("upstreamDuplicates.0");
        schema.person.indices.push("status_net.profile_info.local_id");
        schema.note.indices.push("status_net.notice_id");
        schema.note.indices.push("status_net.message_id");
        schema.group.indices.push("upstreamDuplicates.0");
    };

    plugin.getScript = function() {
        return "/public/javascript/pump.io-statusnet.js";
    };

    plugin.initializeApp = function(app) {

        addRoute("/theme/neo/default-avatar-profile.png", function(req, res, next) {
            res.redirect("/images/default.png", 301);
        });

        addRoute("/public/javascript/pump.io-statusnet.js", function(req, res, next) {
            var root = path.join(__dirname, "javascript");
            res.sendfile("pump.io-statusnet.js", {root: root});
        });

        addRoute("/notice/:id", app.session, principal, noteFromID, principalAuthorOrRecipient, function(req, res, next) {
            showNote(req, res, next);
        });

        addRoute("/conversation/:id", app.session, principal, noteFromID, principalAuthorOrRecipient, function(req, res, next) {
            res.redirect(req.note.url, 301);
        });

        addRoute("/message/:id", app.session, principal, noteFromID, principalAuthorOrRecipient, function(req, res, next) {
            showNote(req, res, next);
        });

        addRoute("/user/:id", userFromID, function(req, res, next) {
            res.redirect(req.person.url, 301);
        });

        addRoute("/tag/:tag", function(req, res, next) {
            var tag = req.params.tag;
            res.redirect("https://ragtag.io/tag/"+tag);
        });

        addRoute("/api/notice/:id", app.session, anyReadAuth, noteFromID, authorOrRecipient, function(req, res, next) {
            var path = _.getPath(req.note, ["links", "self", "href"]);
            if (!path) {
                next(new HTTPError("Object lacks a self link: " + req.note.id, 500));
            } else {
                res.redirect(path, 301);
            }
        });

        addRoute("/api/message/:id", app.session, anyReadAuth, noteFromID, authorOrRecipient, function(req, res, next) {
            var path = _.getPath(req.note, ["links", "self", "href"]);
            if (!path) {
                next(new HTTPError("Object lacks a self link: " + req.note.id, 500));
            } else {
                res.redirect(path, 301);
            }
        });

        addRoute("/api/user/:id", userFromID, function(req, res, next) {
            var path = _.getPath(req.person, ["links", "self", "href"]);
            if (!path) {
                next(new HTTPError("Object lacks a self link: " + req.note.id, 500));
            } else {
                res.redirect(path, 301);
            }
        });
    };
};

module.exports = new StatusnetPlugin();
