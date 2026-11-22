import {afterEach,describe,expect,it,vi} from 'vitest';
import {POST} from '../app/api/schedule-demo/route';
const message={name:'Test Person',email:'test@example.com',businessName:'Example',employeeCount:10,needs:'Walkthrough please',source:'eclipse-timekeeping/contact'};
const request=()=>new Request('https://www.eclipsesystems.pro/api/schedule-demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(message)});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('demo inquiry delivery',()=>{
 it('does not report success when no delivery service is configured',async()=>{vi.stubEnv('RESEND_API_KEY','');vi.stubEnv('DEMO_REQUEST_WEBHOOK_URL','');expect((await POST(request())).status).toBe(503);});
 it('keeps timekeeping notifications distinct and sends to configured company recipients',async()=>{vi.stubEnv('RESEND_API_KEY','synthetic-key');vi.stubEnv('DEMO_REQUEST_WEBHOOK_URL','');const send=vi.fn<typeof fetch>(async()=>new Response('{}',{status:200}));vi.stubGlobal('fetch',send);expect((await POST(request())).status).toBe(200);const payload=JSON.parse(String(send.mock.calls[0]?.[1]?.body));expect(payload.subject).toContain('Eclipse Timekeeping');expect(payload.text).toContain('clockeclipse.com');expect(payload.reply_to).toBe('test@example.com');expect(payload.to).not.toContain('test@example.com');});
});
