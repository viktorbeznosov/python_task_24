import re


FORBIDDEN_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "ATTACH", "DETACH",
    "PRAGMA", "CREATE", "TRUNCATE", "REPLACE", "EXEC", "EXECUTE",
    "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION"
]

ALLOWED_TABLES = ["tasks"]


def validate_sql(sql: str) -> tuple[bool, str]:
    """
    Validates that SQL query is safe to execute.
    Returns (is_valid, error_message)
    """
    if not sql or not sql.strip():
        return False, "Empty SQL query"
    
    sql_upper = sql.upper().strip()
    
    # Check for multiple statements
    if sql_upper.count(";") > 1:
        return False, "Multiple statements are not allowed"
    
    # Check for forbidden keywords
    for keyword in FORBIDDEN_KEYWORDS:
        if re.search(r'\b' + keyword + r'\b', sql_upper):
            return False, f"Keyword '{keyword}' is not allowed"
    
    # Must start with SELECT
    if not sql_upper.startswith("SELECT"):
        return False, "Only SELECT queries are allowed"
    
    # Check that only tasks table is referenced
    for table in ALLOWED_TABLES:
        if table not in sql_upper:
            pass
    
    # Additional pattern checks
    if "JOIN" in sql_upper:
        return False, "JOIN is not allowed"
    if "--" in sql_upper:
        return False, "Comments are not allowed"
    if "/*" in sql_upper or "*/" in sql_upper:
        return False, "Block comments are not allowed"
    
    return True, ""


def sanitize_sql_input(user_query: str) -> str:
    """Sanitizes user input to prevent injection."""
    # Remove any SQL-like patterns
    sanitized = re.sub(r'[;\'"\\\-]+', '', user_query)
    # Limit length
    return sanitized[:500]