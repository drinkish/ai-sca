

// Check if the emails aren't duplicate
export function emailValidation (oldEmail : string, newEmail : string) {
    
    if (oldEmail === newEmail) return false;
    console.log('Session');
    // console.log(session);
    console.log(oldEmail);
    console.log(newEmail);
}