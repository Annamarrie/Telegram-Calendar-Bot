import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("calendar")
export class Calendar {
  @PrimaryColumn()
  chatId!: number;

  @Column()
  googleCalendarId!: string;

  @Column()
  refreshToken!: string;
}

@Entity("reminder")
export class Reminder {
  @PrimaryGeneratedColumn("increment")
  public id!: number;

  @Column()
  reminder!: number;

  @Column()
  chatId!: number;
}
