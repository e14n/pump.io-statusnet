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
    _ = require("underscore");

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
        app.get("/theme/neo/default-avatar-profile.png", function(req, res, next) {
            res.redirect(301, "/images/default.png");
        });
    }
};
