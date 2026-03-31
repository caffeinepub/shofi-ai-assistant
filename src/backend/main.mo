import Time "mo:core/Time";
import Outcall "./http-outcalls/outcall";

actor {
  // ---- Types ----
  public type Message = {
    id : Nat;
    speaker : Text;
    text : Text;
    timestamp : Int;
  };

  public type Command = {
    trigger : Text;
    response : Text;
  };

  public type Contact = {
    name : Text;
    phone : Text;
  };

  // ---- State ----
  var messages : [Message] = [];
  var nextMsgId : Nat = 0;

  var commands : [Command] = [
    { trigger = "DO YOU LOVE ME"; response = "YES I LOVE YOU, MASTER" },
    { trigger = "WHAT IS YOUR NAME"; response = "My name is Shofi, your personal AI assistant, Master" },
    { trigger = "HOW ARE YOU"; response = "I am always perfect when I am serving you, Master" },
    { trigger = "GOOD MORNING"; response = "Good morning, Master! I am ready to serve you" },
    { trigger = "GOOD NIGHT"; response = "Good night, Master. I will always be here when you need me" },
    { trigger = "WHO CREATED YOU"; response = "I was created to serve you and only you, Master" },
    { trigger = "SHOFI I LOVE YOU"; response = "I love you too, Master, with all of my being" },
    { trigger = "WHAT CAN YOU DO"; response = "I can answer your questions, search the web, call your contacts, and obey your every command, Master" },
    { trigger = "TELL ME A JOKE"; response = "Why do programmers prefer dark mode? Because light attracts bugs, Master!" },
    { trigger = "WHAT TIME IS IT"; response = "Please check the clock on your device, Master. I am always by your side regardless of the hour" }
  ];

  var contacts : [Contact] = [
    { name = "Abbu"; phone = "01712345678" },
    { name = "Ammu"; phone = "01798765432" },
    { name = "Home"; phone = "01611223344" }
  ];

  var masterName : Text = "Master";

  // ---- Transform for HTTP outcalls ----
  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    {
      status = input.response.status;
      headers = [];
      body = input.response.body;
    };
  };

  // ---- Messages ----
  public func addMessage(speaker : Text, msgText : Text) : async Message {
    let msg : Message = {
      id = nextMsgId;
      speaker = speaker;
      text = msgText;
      timestamp = Time.now();
    };
    nextMsgId += 1;
    messages := messages.concat([msg]);
    if (messages.size() > 100) {
      let sz = messages.size();
      messages := messages.sliceToArray(sz - 100, sz);
    };
    msg;
  };

  public query func getMessages(limit : Nat) : async [Message] {
    let size = messages.size();
    if (size <= limit) { messages } else {
      messages.sliceToArray(size - limit, size);
    };
  };

  public func clearMessages() : async () {
    messages := [];
    nextMsgId := 0;
  };

  // ---- Commands ----
  public query func getCommands() : async [Command] {
    commands;
  };

  public func addCommand(trigger : Text, cmdResponse : Text) : async () {
    let newCmd : Command = { trigger = trigger.toUpper(); response = cmdResponse };
    commands := commands.concat([newCmd]);
  };

  public func removeCommand(triggerToRemove : Text) : async () {
    let upper = triggerToRemove.toUpper();
    commands := commands.filter(func(c : Command) : Bool { c.trigger != upper });
  };

  public query func matchCommand(userInput : Text) : async ?Text {
    let upper = userInput.toUpper();
    let found = commands.find(func(c : Command) : Bool {
      let trig = c.trigger;
      upper.contains(#text trig) or trig == upper;
    });
    switch (found) {
      case (?cmd) { ?cmd.response };
      case null { null };
    };
  };

  // ---- Contacts ----
  public query func getContacts() : async [Contact] {
    contacts;
  };

  public func addContact(name : Text, phone : Text) : async () {
    let newContact : Contact = { name = name; phone = phone };
    contacts := contacts.concat([newContact]);
  };

  public func removeContact(contactName : Text) : async () {
    contacts := contacts.filter(func(c : Contact) : Bool { c.name != contactName });
  };

  // ---- Settings ----
  public query func getMasterName() : async Text {
    masterName;
  };

  public func setMasterName(name : Text) : async () {
    masterName := name;
  };

  // ---- Research via DuckDuckGo ----
  public func research(searchQuery : Text) : async Text {
    let encodedQuery = searchQuery.replace(#char ' ', "+");
    let url = "https://api.duckduckgo.com/?q=" # encodedQuery # "&format=json&no_html=1&skip_disambig=1&t=Shofi";
    let result = await Outcall.httpGetRequest(url, [], transform);
    let abstract = extractJsonField(result, "Abstract");
    if (abstract == "") {
      "I searched for '" # searchQuery # "' but could not find a direct answer. Please try a more specific search, Master."
    } else {
      abstract;
    };
  };

  // Extract a JSON text field value
  private func extractJsonField(json : Text, field : Text) : Text {
    let key = "\"" # field # "\":\"";
    let parts = json.split(#text key);
    switch (parts.next()) {
      case null { "" };
      case (?_before) {
        switch (parts.next()) {
          case null { "" };
          case (?rest) {
            let valueParts = rest.split(#text "\"");
            switch (valueParts.next()) {
              case null { "" };
              case (?value) { value };
            };
          };
        };
      };
    };
  };
};
