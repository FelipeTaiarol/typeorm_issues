import {createConnection, Connection, Column, PrimaryColumn, Entity, SelectQueryBuilder, getRepository, JoinColumn, OneToOne, ManyToOne, OneToMany} from "typeorm";

export interface Day {
    /** 0 for empty date */
    year: number;
    /** 
     * from 1 to 12
     * WARNING: the javascript Date object goes from 0 to 11.
    */
    month: number;
    day: number;
  }

export function convertDateToDay(date: Date): Day{
    if(date){
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        }
    }else{
        return undefined;
    }
}

export function convertDayToDate(day: Day): Date{
    if(day && day.year > 0 && day.month > 0 && day.day > 0){
        return new Date(day.year, day.month - 1, day.day);
    }else{
        return undefined;
    }
}


@Entity('TABLE_1')
export class Table1{
  @PrimaryColumn({name: "ID"})
  id: number;
  @Column({name: "NAME"})
  name: string;
}

@Entity('TABLE_2')
export class Table2{
  @PrimaryColumn({name: "ID"})
  id: number;
  @Column({name: 'TABLE_1_ID'})
  table1Id: number;
}


const dateToMillisecondsTransformer = {
	from (value: Date): number {
		return value.getTime();
	},
	to (value: number): Date {
		return new Date(value)
	}
} 

const dateToDayTransformer = {
	from (value: Date): Day {
		return convertDateToDay(value);
	},
	to (value: Day): Date {
		return convertDayToDate(value);
	}
}

@Entity("RUUM_PARTICIPATION")
export class RuumParticipation {
	@PrimaryColumn({name: 'RUUM_ID'})
	ruumId: string;
	@PrimaryColumn({name: 'USER_ID'})
	userId: string;
	@JoinColumn({name: 'USER_ID'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	user: User;
	@Column({name: 'LAST_SAW_RUUM_AT', transformer: dateToMillisecondsTransformer})
	lastSawRuumAt: number;
	@Column({name: 'COLOR'})
	color: string;
	@Column({name: 'CREATED_AT', select: false})
	createdAt: number;
	@Column({name: 'ADDED_BY', select: false})
	addedBy: string;
}

@Entity("RUUM_ACTIONS_WHILE_GONE")
export class ChangeWhileGone {
	@PrimaryColumn({name: 'ID'})
	id: number;
	@JoinColumn({name: 'RUUM_ID'})
	@ManyToOne(type => Ruum, ruum => ruum.changesWhileGone)
	ruumId: Ruum;
	@PrimaryColumn({name: 'OBJECT_TYPE'})
	objectType: ActionsWhileGoneObjectType;
	@PrimaryColumn({name: 'OBJECT_ID'})
	objectId: string;
	@PrimaryColumn({name: 'PARTICIPANT_TO_SEE_ID'})
	participantToSee: string;

	@Column({name: 'DID_SEE_AT'})
	didSeeAt: string;
	@Column({name: 'INTERACTION_TYPE'})
	interactionType: ActionsWhileGoneInteractionType;

	@Column({name: 'CREATED_AT'})
	createdAt: number;
	@JoinColumn({name: 'CREATED_BY'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	user: User;
}

export type ActionsWhileGoneObjectType = 'TASK' | 'POLL' | 'ATTACHMENT' | 'SECTION' | 'MAIL';
export type ActionsWhileGoneInteractionType = 'ADD' | 'EDIT' | 'DELETE' | 'ASSIGN' | 'COMMENT';
 
@Entity("USERS")
export class User {
	@PrimaryColumn({name: 'USER_ID'})
	userId: string;
	@JoinColumn({name: 'USER_ID'})
	@OneToOne(type => RuumParticipation, ruumParticipation => ruumParticipation.userId && ruumParticipation.ruumId)
	ruumUserDetails: RuumParticipation;
	
	@Column({name: 'FULL_NAME'})
	displayName: string;
	@Column({name: 'INITIALS'})
	initials: string;
	@Column({name: 'MAIL', select: false})
	mail: string;
	@Column({name: 'UPDATE_SEQUENCE', select: false})
	updateSequence: string;	
	@Column({name: 'DELETED', select: false})
	deleted: boolean;

	color: string;
}

@Entity("RUUM_TAGS")
export class RuumTag {
	@PrimaryColumn({name: 'ID', select: false})
	id: number;
	@JoinColumn({name: 'RUUM_ID'})
	@ManyToOne(type => Ruum, ruum => ruum.tags)
	ruumId: string;
	
	@PrimaryColumn({name: 'TAG_TEXT'})
	text: string;

	@Column({name: 'CREATED_AT', select: false})
	createdAt: number;
	@Column({name: 'CREATED_BY', select: false})
	createdBy: string;
}

@Entity("RUUMS")
export class Ruum {
	@PrimaryColumn({name: 'RUUM_ID'})
	id: string;

	@Column({name: 'NAME'})
	name: string;

	@Column({name: 'STATUS'})
	status?: RuumStatus;

	@OneToMany(type => RuumTag, ruumTag => ruumTag.ruumId, {eager: true})
	tags: RuumTag[];

	@OneToMany(type => ChangeWhileGone, whileGoneAction => whileGoneAction.ruumId)
	changesWhileGone: ChangeWhileGone[];

	@Column({name: 'CREATED_AT', transformer: dateToMillisecondsTransformer})
	createdAt: number;

	@Column({name: 'CHANGED_AT', transformer: dateToMillisecondsTransformer})
	changedAt?: number;

	@Column({name: 'ARCHIVED_AT', transformer: dateToMillisecondsTransformer})
	archivedAt?: number;

	@JoinColumn({name: 'CHANGED_BY'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	changedBy: User;

	@JoinColumn({name: 'CREATED_BY'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	createdBy: User;

	@JoinColumn({name: 'RUUM_ID'})
	@ManyToOne(type => Task, task => task.ruumId, {eager: false})
	tasks: Task
	
	favorite?: RuumFavorite;
	participants: RuumParticipation[];
}

export type RuumStatus = 'On Track' | 'Minor Delay' | 'Major Delay' | 'Completed';
export const ruumStatusValues = ['On Track', 'Minor Delay', 'Major Delay', 'Completed'];

@Entity("TASKS")
export class Task {
	@Column({name: 'ID', select: false})
	id: number;
	@PrimaryColumn({name: 'TASK_ID'})
	taskId: string;
	@PrimaryColumn({name: 'RUUM_ID'})
	ruumId: string;

	@JoinColumn({name: 'RUUM_ID'})
	@ManyToOne(type => Ruum, ruum => ruum.tasks, {eager: false})
	ruum: Ruum;

	@Column({name: 'TASK_DESCRIPTION'})
	description: string;
	@Column({name: 'STATUS'})
	status: string;
	@Column({name: 'START_DATE', transformer: dateToDayTransformer})
    startDate: number;
	@Column({name: 'DUE_DATE', transformer: dateToDayTransformer})
	dueDate: number;

	// @OneToMany(type => Comment, comment => comment.objectId)
	// comments: Comment[];
	
	@Column({name: 'CREATED_AT',  transformer: dateToMillisecondsTransformer})
	createdAt: number;
	@JoinColumn({name: 'CREATED_BY'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	createdBy: User;
	@Column({name: 'CHANGED_AT',  transformer: dateToMillisecondsTransformer})
	changedAt: string;
	@JoinColumn({name: 'CHANGED_BY'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	changedBy: User;
}

@Entity("ASSIGNED_TASKS")
export class TaskAssignment {
	@Column({name: 'ID', select: false})
	id: number;

	@PrimaryColumn({name: 'TASK_ID'})
	taskId: string;

	@PrimaryColumn({name: 'RUUM_ID'})
	ruumId: string;

	@PrimaryColumn({name: 'USER_ID'})
	@JoinColumn({name: 'USER_ID'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	assignedTo: User;
}

@Entity("COMMENTS")
export class Comment {
	@Column({name: 'RUUM_ID', select: false})
	ruumId: string;
	@PrimaryColumn({name: 'ID', select: false})
	id: number;
	@Column({name: 'OBJECT_ID'})
	objectId: string;
	
	@Column({name: 'COMMENT_ID', select: false})
	commentId: string;
	@Column({name: 'OBJECT_TYPE', select: true})
	objectType: string;
	@Column({name: 'TEXT', select: true})
	text: string;

	@JoinColumn({name: 'CREATED_BY'})
	@OneToOne(type => User, user => user.userId)
	createdBy: User;
	@Column({name: 'CHANGED_AT', transformer: dateToMillisecondsTransformer})
	changedAt: number;
	@JoinColumn({name: 'CHANGED_BY'})
	@OneToOne(type => User, user => user.userId, {eager: true})
	changedBy: User;
}

@Entity("RUUM_FAVORITES")
export class RuumFavorite {
	@PrimaryColumn({name: 'RUUM_ID'})
	ruumId: string;
	@PrimaryColumn({name: 'USER_ID'})
	userId: string;
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
                schema: 'read',
                password: 'postgres',
                database: 'ruum',
                entities: [Table1, Table2, Ruum, RuumTag, User, RuumParticipation, Task, TaskAssignment, Comment, ChangeWhileGone, RuumFavorite]
            })
        }
        return this.connenction; 
    }

    test1(){
        console.log('\nTEST 1\n');
        return this.getConnection().then(connection => {
             return connection.createQueryBuilder().select('t1')
             .from(Table1, 't1')
             .leftJoinAndMapOne("t1.t2", Table2, "Table2", '"Table2"."TABLE_1_ID" = t1."ID"')
            .addOrderBy('t1.name')
            .skip(0).take(10)
        }).then(q => this.runTest(q));
    }

    test2(){
        console.log('\nTEST 2\n');
        return this.getConnection().then(connection => {
             return connection.createQueryBuilder().select(['t1', 'lower(t1.name) as "t1_LOWER_NAME"'])
             .from(Table1, 't1')
             .leftJoinAndMapOne("t1.t2", Table2, "Table2", '"Table2"."TABLE_1_ID" = t1."ID"')
            .addOrderBy('"t1_LOWER_NAME"');
        }).then(q => this.runTest(q));
    }

    test3(){
        console.log('\nTEST 3\n');
        return this.getConnection().then(connection => {
             return connection.createQueryBuilder().select(['t1', 'lower(t1.name) as "t1_LOWER_NAME"'])
             .from(Table1, 't1')
             .leftJoinAndMapOne("t1.t2", Table2, "Table2", '"Table2"."TABLE_1_ID" = t1."ID"')
            .addOrderBy('"t1_LOWER_NAME"')
            .skip(0).take(10)
        }).then(q => this.runTest(q));
    }

    test4(){
        return this.getConnection().then(connection => {
            const builder = connection.createQueryBuilder();
            
            const sub = builder.subQuery().select('t1.id').from(Table1, 't1').where('lower(t1.name) like lower(:name)', {name: '%a%'})

            return builder.select('t1').from(Table1, 't1').where('t1.id IN ' + sub.getQuery());
            
        }).then(q => this.runTest(q));
    }

    test5(){
        return this.getConnection().then(connection => {
             return connection.createQueryBuilder().select(['t1.id', 't1.name'])
             .from(Table1, 't1')
             .addSelect('count(1)', 'count')
             .leftJoin(Table2, 't2', 't1.id = t2.table1Id')
             .groupBy('t1.id').addGroupBy('t1.name')
             .orderBy('count')
            //  .skip(0).take(2)
        }).then(q => this.runTest(q));
    }

    test6(){
        console.log('\nTEST 6\n');
        const loggedUserId = 'ruumie2';
        return this.getConnection().then(connection => {
             const queryByuilder = connection.createQueryBuilder();

            queryByuilder.select('ruum').from(Ruum, 'ruum')
            .addSelect('favorite.userId "IS_FAVORITE"')
            .addSelect('count(*) as "CHANGES"')
            /** innerJoin so that only ruums where there is a participation */
            .innerJoin(RuumParticipation, 'participation', `ruum.id = participation.ruumId AND participation.userId = :loggedUserId`, {loggedUserId} )
            
            .leftJoin(RuumFavorite, 'favorite', `ruum.id = favorite.ruumId AND favorite.userId = :loggedUserId`, {loggedUserId} )
            .leftJoin(ChangeWhileGone, 'change', `change.didSeeAt is NULL AND change.ruumId = ruum.id AND change."CREATED_BY" != :loggedUserId AND change.participantToSee = :loggedUserId`, {loggedUserId} )
            .groupBy('ruum.id').addGroupBy('ruum.name').addGroupBy('ruum.status')
            .addGroupBy('ruum.createdAt').addGroupBy('ruum.createdBy').addGroupBy('ruum.changedAt')
            .addGroupBy('ruum.changedBy').addGroupBy('"IS_FAVORITE"')
            
            // .skip(0).take(2)

            return queryByuilder;
        }).then(q => this.runTest(q));
    }

    private addFilters(){

    }

    runTest(queryBuilder: SelectQueryBuilder<any>){
        console.log(queryBuilder.getSql());
        return queryBuilder.getManyAndCount()
                            .then(data => console.log(data))
                            .catch(err => console.error(err));
    }
}

const test = new Test();

test.test6();

// Promise.resolve().then(() => {
//     return test.test1();
// }).then(() => {
//     return test.test2();
// }).then(() => {
//     return test.test3();
// })

