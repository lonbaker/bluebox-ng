// Generated by CoffeeScript 1.6.3
/*

Copyright (C) 2013, Jesus Perez <jesusprubio gmail com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var AsteroidsConn, Grammar, MaxMind, Parser, Printer, Shodan, SipInvSpoof, SipMessage, Utils, fs;

SipMessage = require("../tools/sipMessage.coffee").SipMessage;

AsteroidsConn = require("../tools/asteroidsConn.coffee").AsteroidsConn;

Parser = require("../tools/parser.coffee").Parser;

Printer = require("../tools/printer.coffee").Printer;

Utils = require("../tools/utils.coffee").Utils;

Shodan = require("./shodan").Shodan;

MaxMind = require("./maxMind").MaxMind;

Grammar = require("../tools/grammar").Grammar;

fs = require("fs");

exports.SipInvSpoof = SipInvSpoof = (function() {
  var callWithExt, oneCall;

  function SipInvSpoof() {}

  oneCall = function(target, port, path, srcHost, transport, toExt, fromExt) {
    var conn, lport, msgObj, msgSend;
    lport = Utils.randomPort();
    msgObj = new SipMessage("INVITE", "", target, port, srcHost, lport, fromExt, toExt, transport, "", "", "", false, "", "", "", "", "", "");
    msgSend = String(msgObj.create());
    conn = new AsteroidsConn(target, port, path, transport, lport);
    conn.on("newMessage", function(stream) {});
    conn.on("error", function(error) {});
    conn.send(msgSend);
    Printer.highlight("Calling extension ");
    Printer.normal("" + toExt);
    Printer.highlight(" in host ");
    Printer.normal("" + target + "\n");
    return Printer.removeCursor();
  };

  callWithExt = function(target, port, path, srcHost, transport, rangeExt, delay, callId) {
    var doLoopNum, rangeExtParsed,
      _this = this;
    if (Grammar.extRangeRE.exec(rangeExt)) {
      rangeExtParsed = Parser.parseExtRange(rangeExt);
      doLoopNum = function(i) {
        return setTimeout(function() {
          oneCall(target, port, path, srcHost, transport, i, callId);
          if (i < rangeExtParsed.maxExt) {
            return doLoopNum(parseInt(i, 10) + 1);
          }
        }, delay);
      };
      return doLoopNum(rangeExtParsed.minExt);
    } else {
      if (Grammar.fileRE.exec(rangeExt)) {
        return fs.readFile(rangeExt, function(err, data) {
          var doLoopString, extensions, splitData,
            _this = this;
          if (err) {
            return Printer.printError("sipInvSpoof: " + err);
          } else {
            extensions = data;
            splitData = data.toString().split("\n");
            doLoopString = function(i) {
              return setTimeout(function() {
                oneCall(target, port, path, srcHost, transport, splitData[i], callId);
                if (i < splitData.length - 1) {
                  return doLoopString(i + 1);
                }
              }, delay);
            };
            return doLoopString(0);
          }
        });
      } else {
        return oneCall(target, port, path, srcHost, transport, rangeExt, callId);
      }
    }
  };

  SipInvSpoof.run = function(target, port, path, srcHost, transport, rangeExt, delay, callId) {
    var doLoop, initHost, lastHost, net, net2D, netA, netB, netC, netD,
      _this = this;
    Printer.normal("\n");
    if ((Grammar.ipRangeRE.exec(target)) || (Grammar.ipRangeRE2.exec(target))) {
      initHost = (target.split("-"))[0];
      lastHost = (target.split("-"))[1];
      netA = (initHost.split("."))[0];
      netB = (initHost.split("."))[1];
      netC = (initHost.split("."))[2];
      netD = (initHost.split("."))[3];
      net = "" + netA + "." + netB + "." + netC;
      if (Grammar.ipRangeRE.exec(target)) {
        net2D = (lastHost.split("."))[3] || lastHost;
      } else {
        net2D = lastHost;
      }
      doLoop = function(i) {
        return setTimeout(function() {
          var targetI;
          targetI = "" + net + "." + i;
          callWithExt(targetI, port, path, srcHost, transport, rangeExt, delay, callId);
          if (i < parseInt(net2D, 10)) {
            return doLoop(parseInt(i, 10) + 1);
          }
        }, delay);
      };
      return doLoop(parseInt(netD, 10));
    } else {
      return callWithExt(target, port, path, srcHost, transport, rangeExt, delay, callId);
    }
  };

  return SipInvSpoof;

})();