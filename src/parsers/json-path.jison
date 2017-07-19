%start jsonPath
%ebnf
%options ranges

%%

jsonPath
  : '$' '.' refList
  { return $$ = ['$', $refList]; }
  | '$' sqrBRefList '.' refList
  { $refList = [].concat($sqrBRefList, $refList); return $$ = ['$', $refList]; }
  | '$' sqrBRefList
  { return $$ = ['$', $sqrBRefList]; }
  | '$'
  { return $$ = ['$', []]; }
  ;

refList
  : ID
  { $$ = [['id', $ID ]]; }
  | sqrBRef
  { $$ = [$sqrBRef]; }
  | refList '.' ID
  { $$ = $refList; $$.push(['id', $ID ]); }
  | refList sqrBRef
  { $$ = $refList; $$.push($sqrBRef); }
  ;

sqrBRefList
  : sqrBRef
  { $$ = [$sqrBRef]; }
  | sqrBRefList sqrBRef
  { $$ = $sqrBRefList; $$.push($sqrBRef); }
  ;

sqrBRef: '[' bracketId ']'
  { $$ = ['id', $bracketId]; }
  ;

bracketId: STRING
  { $$ = $STRING; }
  | NUMBER
  { $$ = parseInt($NUMBER); }
  | '*'
  { $$ = ['*']; }
  ;
