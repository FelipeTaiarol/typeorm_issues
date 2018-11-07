import {createConnection, Connection, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;

    posts: Post[];
}

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column('int')
    categoryId: number;
}

class Test{
    connenction: Promise<Connection>;

   getConnection(): Promise<Connection> {
        if(!this.connenction){
            this.connenction = createConnection({
                type: "postgres",
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                schema: 'public',
                password: 'postgres',
                database: 'test',
                entities: [Category, Post],
                dropSchema: true, 
                synchronize: true
            });
        }
        return this.connenction; 
    }

    run(){
        this.getConnection().then(connection => {
            return this.addData(connection)
                        .then(() => this.normal(connection))
                        .then(() => this.withSubQuery(connection))
        
        })
    }

    normal(connection){
        const qb = connection.createQueryBuilder().select('category').from(Category, 'category')
                                                  .leftJoinAndMapMany('category.posts', Post, 'post', 'post.categoryId = category.id');

        return this.runQuery(qb)
    }

    withSubQuery(connection){
        const qb = connection.createQueryBuilder().select('category').from(Category, 'category')
                    .leftJoinAndMapMany('category.posts', qb => qb.select().from(Post, 'post'), 'post', 'post."categoryId" = category.id');

        return this.runQuery(qb);
    }

    addData(connection){
        const catRepo = connection.getRepository(Category);    
        const postRepo = connection.getRepository(Post);    

        return Promise.all([
            catRepo.save({id: 1, name: 'cat1'}),
            postRepo.save({id: 2, title: 'p1', categoryId: 1}),
            postRepo.save({id: 2, title: 'p1', categoryId: 1})
        ])
    }

    runQuery(qb){
        console.log(qb.getSql());
        return qb.getMany()
                        .then(data => {
                            console.log(data)
                        }).catch(err => {
                            console.error(err)
                        });
    }
}

new Test().run();