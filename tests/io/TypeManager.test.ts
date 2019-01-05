import { TypeManager } from '../../src/hprose.io';

test('test getType', () => {
    let type = TypeManager.getType('Test');
    expect(type.name).toBe('Test');
    class User {
        public name: string = '';
        public age: number = 0;
    }
    TypeManager.register(User, 'MyUser');
    type = TypeManager.getType('MyUser');
    expect(type.name).toBe('User');
});