// ECMA-262 5th Edition, 15.12.1 The JSON Grammar. Parses JSON strings into objects.
// Derived from .js version by Zach Carter

//tokens STRING NUMBER { } [ ] , : TRUE FALSE NULL
%start JSONText
%ebnf
%options ranges

%%

JSONString: STRING
  { $$ = { "type": "string", "t": $1, "v": $1, "meta": @$ }; }
  ;

JSONNumber: NUMBER
  { $$ = { "type": "number", "t": $1, "v": $1, "meta": @$ } }
  ;

JSONNullLiteral: NULL
  { $$ = { "type": "null", "t": $1, "v": $1, "meta": @$ }; }
  ;

JSONBooleanLiteral: TRUE
  { $$ = { "type": "boolean", "t": $1, "v": $1, "meta": @$ }; }
  | FALSE
  { $$ = { "type": "boolean", "t": $1, "v": $1, "meta": @$ }; }
  ;

JSONText: JSONValue
  { return $$ = $1; }
  ;

JSONValue: JSONNullLiteral
  { $$ = $1; }
  | JSONBooleanLiteral
  { $$ = $1; }
  | JSONString
  { $$ = $1; }
  | JSONNumber
  { $$ = $1; }
  | JSONObject
  { $$ = $1; }
  | JSONArray
  { $$ = $1; }
  ;

JSONObject: "{" "}"
  { $$ = { "type": "object", "t": null, "v": {}, "meta": @$ }; }
  | "{" JSONMemberList "}"
  { $$ = { "type": "object", "t": $2, "v": $2.v, "meta": @$ }; }
  ;

JSONMember: JSONString ":" JSONValue
  { $$ = { "type": "member", "t": [$1, $3], "v": [$1.v, $3.v], "meta": @$ }; }
  ;

JSONMemberList: JSONMember
  { $$ = { "type": "memberlist", "t": $1, "v": {}, "meta": @$ }; $$.v[$1[0]] = $1[1]; }
  | JSONMemberList "," JSONMember
  { $$ = $1; $1.v[$3.v[0]] = $3.v[1]; }
  ;

JSONArray: "[" "]"
  { $$ = { "type": "array", "t": null, "v": [], "meta": @$ }; }
  | "[" JSONElementList "]"
  { $$ = { "type": "array", "t": $2, "v": $2.v, "meta": @$ }; }
  ;

JSONElementList: JSONValue
  { $$ = { "type": "elementlist", "t": [$1], "v": [$1.v], "meta": @$ }; }
  | JSONElementList "," JSONValue
  { $$ = $1; $1.v.push($3.v); }
  ;
