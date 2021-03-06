mmj = Packages.mmj;
ExecutionMode = mmj.pa.MacroManager.ExecutionMode;
CallbackType = mmj.pa.MacroManager.CallbackType;
messages = batchFramework.outputBoss.messages;
grammar = batchFramework.grammarBoss.grammar;
proofAsst = batchFramework.proofAsstBoss.proofAsst;
logicalSystem = batchFramework.logicalSystemBoss.logicalSystem;
verifyProofs = batchFramework.verifyProofBoss.verifyProofs;
proofAsstPreferences = batchFramework.proofAsstBoss.proofAsstPreferences;
macroManager = batchFramework.macroBoss.getMacroManager(true);
log = function(s) { print.apply(this, arguments); return s; }
function debug(object, indent) {
	if (!indent) indent = '';
	var output = '\n' + indent + '{\n';
	var found;
	for (var property in object) {
	  output += indent + '  ' + property + ': ' +
	  		debug(object[property], indent+'  ') + '; \n';
	  found = true;
	}
	return found ? output + indent + '}' : object;
}
function runMacro(name) {
	macroManager.runMacroRaw(name)
}
function eval(code) {
	macroManager.evalRaw(code)
}
function getSym(sym) {
	return logicalSystem.getSymTbl().get(sym);
}
function getStmt(stmt) {
	return logicalSystem.getStmtTbl().get(stmt);
}
(function() {
	var callbacks = [];
	post = function(type, f) {
		if (typeof f === 'undefined') return;
		var index = type.ordinal();
		if (index in callbacks)
			callbacks[index].unshift(f);
		else {
			callbacks[index] = [f];
			macroManager.setCallback(type, function() {
				if (index in callbacks) {
					var list = callbacks[index];
					for (var i = list.length-1; i >= 0; i--)
						if (!(list[i])())
							list.splice(i, 1);
				}
			});
		}
	}
	function resetDependent(types) {
		return function() {
			for each (t in types) {
				var index = t.ordinal();
				if (index in callbacks)
					callbacks[index] = [];
			}
			return true;
		};
	};
	var c = CallbackType;
	post(c.PARSE_FAILED, resetDependent([c.BEFORE_PARSE,
         c.WORKSHEET_PARSE, c.AFTER_LOCAL_REFS, c.AFTER_PARSE]));
	post(c.AFTER_PARSE, resetDependent([c.PARSE_FAILED]));
	post(c.AFTER_UNIFY, resetDependent([c.AFTER_RENUMBER]));
})();
macroManager.setPrepMacro("prep");
post(CallbackType.BUILD_GUI, function() {
	proofAsstGUI = proofAsst.proofAsstGUI;
	function log() {
		var s = Array.prototype.slice.call(arguments).join(" ");
		messages.accumInfoMessage(s,[]);
		return s;
	}
});
function setKeyCommand(key, f) {
	post(CallbackType.BUILD_GUI, function() {
		proofAsstGUI = proofAsst.proofAsstGUI;
		with (new JavaImporter(Packages.javax.swing)) {
			var window = proofAsstGUI.mainFrame.getContentPane();
			window.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW)
				.put(KeyStroke.getKeyStroke(key), key);
			window.getActionMap().put(key,
				new (Java.extend(AbstractAction, f))());
		}
	});
}
post(CallbackType.BEFORE_PARSE, function() {
	messages = proofWorksheet.messages;
	return true;
});
post(CallbackType.TRANSFORMATION_SET_UP, function() {
	runMacro("transformations");
	return true;
});
function unify() {
	proofAsstGUI.unificationAction(false, false,
		null, null, null).actionPerformed(null);
}

////////////////////////////////////////////////////////
// USER SPACE: perform extra custom initializations here
////////////////////////////////////////////////////////

// Example: on ctrl-M, prepend all numeric step names with 'a'
//
//setKeyCommand("ctrl M", function() {
//	post(CallbackType.PREPROCESS, function() {
//		proofText = proofText.replace(/\d+[:,]/g,"a$&");
//	});
//	unify();
//});
