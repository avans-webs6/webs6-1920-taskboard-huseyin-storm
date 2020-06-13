import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {AngularFirestore, DocumentReference} from '@angular/fire/firestore';
import {User} from '../interfaces/User';
import {map} from 'rxjs/operators';
import {FirestoreService} from './firestore.service';

export interface Project {
  id: string;
  name: string;
  description: string;
  members: Array<DocumentReference>;
  owner: string;
  created_at: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  public projects$: Observable<Project[]>;
  public selectedProject: Project;

  constructor(private firestore: AngularFirestore, private db: FirestoreService, private authService: AuthService) {
    // this.db.doc<DocumentReference>(`users/${this.authService.getUser.uid}`).get().subscribe(async e => {


    // });
  }

  public async getProject$(): Promise<Observable<Project[]>> {
    const userRef = await this.db.doc<DocumentReference>(`users/${this.authService.getUser.uid}`).ref;
    this.projects$ = await this.db.colWithIds$('projects', ref => ref.where('members', 'array-contains', userRef));
    return this.projects$;
  }

  // public getProjects$(): Observable<Project[]> {
  //   const users$ = this.firestore.collection<User>('users').valueChanges({idField: 'uid'});
  //   return combineLatest([users$, this.projects$]).pipe(map((results) => {
  //     results[1].forEach(project => {
  //       results[0].map(user => {
  //         console.log(user.uid)
  //         console.log(project.owner)
  //         if (`users/${user.uid}` === project.owner) {
  //           project.owner =  user.name;
  //         }
  //         return user;
  //       });
  //     });
  //     return results[1];
  //   }));
  // }

  public getUsersFromProject$(uid: string): Observable<User[]> {
    return this.firestore.collection<User>('users', ref =>
      ref.where('projects', 'array-contains', uid)).valueChanges({idField: 'uid'});
  }

  public async createProject(projectInfo): Promise<string> {
    const projectUid = this.firestore.createId();
    const ownerRef = await this.db.doc(`users/${projectInfo.owner}`).ref;

    await this.firestore.collection<Project>('projects').doc(projectUid).set({
      name: projectInfo.name,
      description: projectInfo.description,
      owner: ownerRef,
      status: 'active',
      members: [ownerRef],
      created_at: new Date()
    });

    return projectUid;
  }

  public async updateProject(project: Project): Promise<void>{
    await this.firestore.collection('projects').doc(project.id).update(project);
  }

}
