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
    addLiked = finishers.addLiked,
    addShared = finishers.addShared,
    addLikers = finishers.addLikers,
    firstFewReplies = finishers.firstFewReplies,
    firstFewShares = finishers.firstFewShares,
    addFollowed = finishers.addFollowed;

module.exports = {

    log: null,

    initializeLog: function(log) {
        this.log = log.child({component: "pump.io-statusnet"});
        return;
    },
    initializeSchema: function(schema) {
        // Add indices that help us
        schema.person.indices.push("upstreamDuplicates.0");
        schema.person.indices.push("status_net.profile_info.local_id");
        schema.note.indices.push("status_net.notice_id");
        schema.note.indices.push("status_net.message_id");
        schema.group.indices.push("upstreamDuplicates.0");
    },
    getScript: function() {
        return "/public/javascript/pump.io-statusnet.js";
    },
    initializeApp: function(app) {
        var get = app.routes.routes.get;
        app.get("/theme/neo/default-avatar-profile.png", function(req, res, next) {
            res.redirect("/images/default.png", 301);
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/public/javascript/pump.io-statusnet.js", function(req, res, next) {
            var root = path.join(__dirname, "javascript");
            res.sendfile("pump.io-statusnet.js", {root: root});
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/notice/:id", function(req, res, next) {
            Step(
                function() {
                    Note.search({"status_net.notice_id": req.params.id}, this);
                },
                function(err, notes) {
                    if (err) {
                        throw err;
                    } else if (!notes || notes.length != 1) {
                        throw new Error("Error finding note");
                    } else {
                        showNote(req, res, next, notes[0]);
                    }
                }
            );
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/conversation/:id", function(req, res, next) {
            Step(
                function() {
                    Note.search({"status_net.notice_id": req.params.id}, this);
                },
                function(err, notes) {
                    if (err) {
                        throw err;
                    } else if (!notes || notes.length != 1) {
                        throw new Error("Error finding note");
                    } else {
                        showNote(req, res, next, notes[0]);
                    }
                }
            );
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/message/:id", function(req, res, next) {
            Step(
                function() {
                    Note.search({"status_net.message_id": req.params.id}, this);
                },
                function(err, notes) {
                    if (err) {
                        throw err;
                    } else if (!notes || notes.length != 1) {
                        throw new Error("Error finding note");
                    } else {
                        showNote(req, res, next, notes[0]);
                    }
                }
            );
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/user/:id", function(req, res, next) {
            Step(
                function() {
                    Person.search({"status_net.profile_info.local_id": req.params.id}, this);
                },
                function(err, people) {
                    if (err) {
                        throw err;
                    } else if (!people || people.length != 1) {
                        throw new Error("Error finding note");
                    } else {
                        // Permanent redirect
                        res.redirect(people[0].url, 301);
                    }
                }
            );
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/tag/:tag", function(req, res, next) {
            var tag = req.params.tag;
            res.redirect("https://ragtag.io/tag/"+tag);
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/api/notice/:id", function(req, res, next) {
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/api/message/:id", function(req, res, next) {
        });
        // This puts our route at the top
        get.unshift(get.pop());
        app.get("/api/user/:id", function(req, res, next) {
        });
    }
};

var showNote = function(req, res, next, obj) {

    var person = obj.author,
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
};
