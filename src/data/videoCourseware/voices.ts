// Legacy demo labels were descriptions, not verified provider voice names.
export function displayVoiceName(name?:string){return !name||/^原(?:教学老师|悟空角色)声音$/.test(name)?'智能匹配':name;}
