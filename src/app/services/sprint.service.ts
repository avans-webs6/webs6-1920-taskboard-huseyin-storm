import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {FirestoreService} from './firestore.service';
import {AuthService} from './auth.service';
import {Observable} from 'rxjs';
import {Sprint} from '../models/Sprint';
import {Story} from '../models/Story';
import {debounceTime, first} from 'rxjs/operators';
import {FirebaseApp} from '@angular/fire';
import FieldValue = firebase.firestore.FieldValue;
import * as firebase from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class SprintService {

  constructor(private firestore: AngularFirestore, private db: FirestoreService) {
  }

  public getSprints$(projectID: string): Observable<any> {
    return this.firestore.collection('projects').doc(projectID).collection<Sprint>('sprints').valueChanges({idField: 'uid'}).pipe();
  }

  public createSprint(projectID: string, sprint) {
    return this.firestore.collection('projects').doc(projectID).collection('sprints').add(sprint);
  }

  public updateSprint(projectID: string, sprint) {
    return this.firestore.collection('projects').doc(projectID).collection('sprints').doc(sprint.uid).update(sprint);
  }

  public async changeSprintUserStory(projectID: string, prevSprintID: string, sprintID: string, storyID: string) {

    const story = await this.db.doc<Story>(`projects/${projectID}/stories/${storyID}`);

    await this.firestore
      .collection('projects')
      .doc(projectID)
      .collection('sprints')
      .doc<any>(prevSprintID)
      .update({user_stories: FieldValue.arrayRemove(story.ref)});

    await this.firestore
      .collection('projects').doc(projectID)
      .collection('sprints')
      .doc<any>(sprintID)
      .update({user_stories: FieldValue.arrayUnion(story.ref)});

    await this.firestore.doc(story.ref.path).update({assigned_sprint: sprintID});
  }

  public async removeUserStoryFromSprint(projectID: string, sprintID: string, storyID: string) {
    const story = await this.db.doc<Story>(`projects/${projectID}/stories/${storyID}`);

    await this.firestore
      .collection('projects')
      .doc(projectID)
      .collection('sprints')
      .doc<any>(sprintID)
      .update({user_stories: FieldValue.arrayRemove(story.ref)});

    await this.firestore.doc(story.ref.path).update({isAssigned: false, assigned_sprint: null});
  }

  public async addUserStoryToSprint(projectID: string, sprintID: string, storyID: string) {
    const story = await this.db.doc<Story>(`projects/${projectID}/stories/${storyID}`);
    await this.firestore.doc(story.ref.path).update({isAssigned: true, assigned_sprint: sprintID});

    await this.firestore
      .collection('projects').doc(projectID)
      .collection('sprints')
      .doc<Sprint>(sprintID)
      .update({user_stories: [story.ref]});

  }

  public async getSprintDoc(projectId: string, sprintId: string) {
    return this.db.doc<Sprint>(`projects/${projectId}/sprints/${sprintId}`);
  }

  public async getSprint$(doc: AngularFirestoreDocument<Sprint>) {
    return this.db.docWithId$(doc);
  }
}

