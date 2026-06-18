from database import *
from models import *
s = SessionLocal()
print("Users:", s.query(User).count())
print("Tests:", s.query(Test).count())
print("Subs:", s.query(Submission).count())
s.close()
