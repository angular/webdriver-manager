import * as http from 'http';


describe('sever smoke tests', () => {
  it('should be able to ping selenium server', (done) => {
    http.get('http://localhost:4444/wd/hub/status', (resp) => {
      expect(resp.statusCode).toBe(200);
      let logs = '';
      resp.on('data', (chunk) => logs += chunk);
      resp.on('end', () => {
        expect(logs).toContain('"ready": true');
        done()
      });
    });
  });

  it('should be able to ping appium server', (done) => {
    http.get('http://localhost:4723/wd/hub/status', (resp) => {
      expect(resp.statusCode).toBe(200);
      let data = '';
      resp.on('data', (chunk) => data += chunk);
      resp.on('end', () => {
        expect(JSON.parse(data).status).toBe(0);
        done()
      });
    });
  });
});
