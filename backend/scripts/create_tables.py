from backend.app.database import engine, Base
from backend.app.models.lesson import Lesson
from backend.app.models.user import User
from backend.app.models.progress import UserProgress

print('engine url:', getattr(engine, 'url', None))
Base.metadata.create_all(bind=engine)
print('Base.metadata.create_all finished')
