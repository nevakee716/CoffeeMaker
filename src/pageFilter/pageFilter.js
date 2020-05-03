/*jslint browser:true*/
/*global cwAPI, jQuery, cwTabManager*/
(function (cwApi, $) {
  "use strict";
  cwApi.cwSearchEngine.matchName = function (name, shouldMatch, initialValue) {
    var matchesName, nameToSearch, regexp, found, regex, oldValue, oldShouldMatch, shouldMatchs;

    let config = cwAPI.customLibs.utils.getCustomLayoutConfiguration("pageFilter");

    if (config && config.searchOnAllWord) found = true;
    else found = false;
    shouldMatchs = shouldMatch.split(" ");
    shouldMatchs.forEach(function (shouldMatch) {
      if (shouldMatch.length < 2) return;
      oldShouldMatch = shouldMatch;

      if (config && config.replaceAccentUpperCase) shouldMatch = cwApi.replaceSpecialCharacters(shouldMatch);
      regexp = new RegExp(shouldMatch, "gi");
      name = name.toString();
      nameToSearch = name;
      if (config && config.replaceAccentUpperCase) nameToSearch = cwApi.replaceSpecialCharacters(name);
      matchesName = nameToSearch.match(regexp);

      oldValue = name.slice(0);
      if (matchesName) {
        if (config && config.replaceAccentUpperCase) {
          let cleanShouldMatch = shouldMatch.toLowerCase().replace("\\", "");
          let index = nameToSearch.toLowerCase().indexOf(cleanShouldMatch);
          let namePart = name.slice(index, index + cleanShouldMatch.length);
          name = name.replace(namePart, matchTag(namePart));
        } else {
          regex = new RegExp("(" + oldShouldMatch + ")", "gi");
          name = name.replace(regex, matchTag(oldShouldMatch));
        }

        if (!config || !config.searchOnAllWord) found = true;
      } else if (config && config.searchOnAllWord) found = false;
    });

    name = name.replace(/\<\#\#\#/g, "<span class='cw-searchengine-item-found'>");
    name = name.replace(/\#\#\#\>/g, "</span>");

    return {
      found: found,
      name: name,
      oldValue: oldValue,
    };
  };

  var matchTag = function (text) {
    var res = "<###" + text + "###>";
    return res;
  };
})(cwAPI, jQuery);
