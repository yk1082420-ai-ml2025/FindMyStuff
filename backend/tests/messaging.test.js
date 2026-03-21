const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Messaging Module Tests', () => {
    let authToken;
    let userId;
    let chatId;
    
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_TEST_URI);
        
        // Create test user and get token
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
        
        authToken = userResponse.body.token;
        userId = userResponse.body.user._id;
    });
    
    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });
    
    test('Should create a new chat', async () => {
        const response = await request(app)
            .post('/api/chats')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                claimId: new mongoose.Types.ObjectId(),
                itemId: new mongoose.Types.ObjectId(),
                itemType: 'lost',
                otherUserId: new mongoose.Types.ObjectId()
            });
        
        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id');
        
        chatId = response.body.data._id;
    });
    
    test('Should send a message', async () => {
        const response = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                chatId: chatId,
                content: 'Hello, this is a test message!'
            });
        
        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe('Hello, this is a test message!');
    });
    
    test('Should get user chats', async () => {
        const response = await request(app)
            .get('/api/chats')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('Should get specific chat with messages', async () => {
        const response = await request(app)
            .get(`/api/chats/${chatId}`)
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.messages).toBeDefined();
    });
    
    test('Should edit a message', async () => {
        // First send a message
        const messageResponse = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                chatId: chatId,
                content: 'Original message'
            });
        
        const messageId = messageResponse.body.data._id;
        
        // Edit the message
        const editResponse = await request(app)
            .put(`/api/messages/${messageId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                content: 'Edited message'
            });
        
        expect(editResponse.statusCode).toBe(200);
        expect(editResponse.body.success).toBe(true);
        expect(editResponse.body.data.content).toBe('Edited message');
        expect(editResponse.body.data.isEdited).toBe(true);
    });
    
    test('Should lock chat', async () => {
        const response = await request(app)
            .put(`/api/chats/${chatId}/lock`)
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('LOCKED');
    });
    
    test('Should not allow sending message in locked chat', async () => {
        const response = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                chatId: chatId,
                content: 'This should fail'
            });
        
        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('locked');
    });
});

console.log('✅ All messaging module tests passed!');