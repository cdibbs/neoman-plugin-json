// ECMA-262 5th Edition, 15.12.1 The JSON Grammar. Parses JSON strings into objects.
// Derived from .js version by Zach Carter

//tokens STRING NUMBER { } [ ] , : TRUE FALSE NULL
%start JSONText
%ebnf
%options ranges

%%
JSONString: STRING
  { $$ = { "type": "string", "orig": $1, "v": $1, "meta": @$ }; }
  ;

JSONNumber: NUMBER
  { $$ = { "type": "number", "orig": parseFloat($1), "v": $1, "meta": @$ } }
  ;

JSONNullLiteral: NULL
  { $$ = { "type": "null", "orig": null, "v": $1, "meta": @$ }; }
  ;

JSONBooleanLiteral: TRUE
  { $$ = { "type": "boolean", "orig": true, "v": $1, "meta": @$ }; }
  | FALSE
  { $$ = { "type": "boolean", "orig": false, "v": $1, "meta": @$ }; }
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
  { $$ = { "type": "object", "orig": {}, "v": [], "meta": @$ }; }
  | "{" JSONMemberList "}"
  { $$ = { "type": "object", "orig": $2.reduce(function(p, c) { p[c.orig[0]] = c.orig[1]; return p; }, {}), "v": $2, "meta": @$ }; }
  ;

JSONMember: JSONString ":" JSONValue
  { $$ = { "type": "member", "orig": [$1.orig, $3.orig], "v": [$1, $3], "meta": @$ }; }
  ;

JSONMemberList: JSONMember
  { $$ = [ $1 ] }
  | JSONMemberList JSONSep JSONMember
  { $3.meta.leftSep = $JSONSep; $1[$1.length - 1].meta.rightEl = $3.meta; $1.push($3); $$ = $1; }
  ;

JSONArray: "[" "]"
  { $$ = { "type": "array", "orig": [], "v": [], "meta": @$ }; }
  | "[" JSONElementList "]"
  { $$ = { "type": "array", "orig": $2.map(e => e.orig), "v": $2, "meta": @$ }; }
  ;

JSONElementList: JSONValue
  { $$ = [$1]; }
  | JSONElementList JSONSep JSONValue
  { $$ = $1; $3.meta.leftSep = $JSONSep; $1[$1.length - 1].meta.rightEl = $3.meta; $1.push($JSONValue); }
  ;

JSONSep: ","
  { $$ = @$; }
  ;
