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

var Step = require("step"),
    _ = require("underscore"),
    Note = require("../../lib/model/note").Note;

module.exports = {

    log: null,

    initializeLog: function(log) {
        this.log = log.child({component: "pump.io-statusnet"});
        return;
    },

    initializeSchema: function(schema) {
        return;
    },
    initializeApp: function(app) {
        var get = app.routes.routes.get;
        app.get("/theme/neo/default-avatar-profile.png", function(req, res, next) {
            res.redirect("/images/default.png", 301);
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
                    }
                }
            );
        });
        // This puts our route at the top
        get.unshift(get.pop());
    }
};
