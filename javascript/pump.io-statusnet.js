// pump.js
//
// Entrypoint for the pump.io client UI
//
// Copyright 2011-2012, E14N https://e14n.com/
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

// Make sure this exists

if (!window.Pump) {
    window.Pump = {};
}

(function(_, $, Backbone, Pump) {

    // Main entry point

    $(document).ready(function() {
        
        _.extend(Pump.router.routes, {
            routes: {
                "notice/:id":          "notice",
                "message/:id":         "message",
                "user/:id":            "user",
                "conversation/:id":    "conversation",
                "tag/:tag":            "tag"
            }
        });

        _.extend(Pump.router, {
            notice: function(id) {
            },
            message: function(id) {
            },
            user: function(id) {
            },
            conversation: function(id) {
                Pump.router.navigate("/notice/"+id);
            },
            tag: function(tag) {
                window.location.replace("https://ragtag.io/"+tag);
            }
        });
    });

})(window._, window.$, window.Backbone, window.Pump);
