#include <sys/sem.h>

int semid;

void sem_init(key_t key)
{
	semid = semget(key, 0, 0);
	if (semid < 0) {
		semid = semget(key, 1, IPC_EXCL|IPC_CREAT|0666);
		semctl(semid, 0, SETVAL, (int) 1);
	}
}

void sem_enter()
{
	struct sembuf s;
	s.sem_op = -1;
	s.sem_flg = 0;
	s.sem_num = 0;
	semop(semid, &s, 1);
}

void sem_leave()
{
	struct sembuf s;
	s.sem_op = 1;
	s.sem_flg = 0;
	s.sem_num = 0;
	semop(semid, &s, 1);
}
