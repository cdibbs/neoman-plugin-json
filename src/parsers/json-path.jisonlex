// Derived in part from json.jisonlex
digit   [0-9]
int     "-"?(?:[0-9]|[1-9][0-9]+)

%options ranges

%%

\s+                        /* skip whitespace */
{int}                      return 'NUMBER';
"\""(?:\\[\"bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^\"\\])*"\""      { yytext = yytext.substr(1,yyleng-2); return 'STRING'; }
'$'                        return '$';
[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]* return 'ID';
\[                         return '[';
\]                         return ']';
'.'                        return '.';
'*'                        return '*';
":"                        return ':';
"true\b"                   return 'TRUE';
"false\b"                  return 'FALSE';
"null\b"                   return 'NULL';
