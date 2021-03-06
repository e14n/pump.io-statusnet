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

        Pump.router.route("notice/:id", "notice", function(id) {
            var router = this;

            Pump.body.startLoad();

            Pump.ajax({url: "/api/statusnet/notice/"+id,
                       dataType: "json",
                       type: "GET",
                       error: function(jqxhr) {
                           Pump.error("Error fetching notice");
                       },
                       success: function(data) {
                           var obj = Pump.ActivityObject.unique(data);

                           Pump.body.setContent({contentView: Pump.ObjectContent,
                                                 model: obj,
                                                 title: obj.get("displayName") || "notice"},
                                                function() {
                                                    Pump.body.endLoad();
                                                });
                       }
                      });
        });

        Pump.router.route("message/:id", "message", function(id) {
            var router = this;

            Pump.body.startLoad();

            Pump.ajax({url: "/api/statusnet/message/"+id,
                       dataType: "json",
                       type: "GET",
                       error: function(jqxhr) {
                           Pump.error("Error fetching message");
                       },
                       success: function(data) {
                           var obj = Pump.ActivityObject.unique(data);

                           Pump.body.setContent({contentView: Pump.ObjectContent,
                                                 model: obj,
                                                 title: obj.get("displayName") || "message"},
                                                function() {
                                                    Pump.body.endLoad();
                                                });
                       }
                      });
        });

        Pump.router.route("user/:id", "user", function(id) {
            var router = this;

            Pump.body.startLoad();

            Pump.ajax({url: "/api/statusnet/user/"+id,
                       dataType: "json",
                       type: "GET",
                       error: function(jqxhr) {
                           Pump.error("Error fetching user");
                       },
                       success: function(data) {
                           var obj = Pump.ActivityObject.unique(data),
                               nickname = obj.get("preferredUsername");
                           Pump.router.navigate("/"+nickname, true);
                       }
                      });
        });

        Pump.router.route("conversation/:id", "conversation", function(id) {
            Pump.router.navigate("/notice/"+id, true);
        });

        Pump.router.route("tag/:tag", "tag", function(tag) {
            window.location.replace("https://ragtag.io/tag/"+tag);
        });
    });

})(window._, window.$, window.Backbone, window.Pump);
