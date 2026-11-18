const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');const fs=require('node:fs');
const m={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('platform/engines/sponsors/schema.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(require,m,m.exports);
const {createCommitteeSponsorSchema,createSponsorFormSchema}=m.exports;
test('committee can save incomplete donor and later add contacts',()=>{
 const schema=createCommitteeSponsorSchema(['Gold']);
 assert.equal(schema.safeParse({companyName:'Donor'}).success,true);
 assert.equal(schema.safeParse({companyName:'Donor',email:'bad'}).success,false);
 assert.equal(schema.safeParse({companyName:'Donor',email:'a@example.com',contactPerson:'A'}).success,true);
 assert.equal(schema.safeParse({companyName:''}).success,false);
 assert.equal(schema.safeParse({companyName:'Donor',package:'invented'}).success,false);
});
test('public enquiry still requires contact and tier',()=>{
 assert.equal(createSponsorFormSchema(['Gold']).safeParse({companyName:'Donor'}).success,false);
});
test('SQL Server GUID is accepted without accepting arbitrary input',()=>{
 const {z}=require('zod');
 assert.equal(z.string().guid().safeParse('A1234567-1234-0234-0234-123456789ABC').success,true);
 assert.equal(z.string().guid().safeParse('bad-id').success,false);
});
